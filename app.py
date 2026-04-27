from flask import Flask, render_template, jsonify, request
from datetime import datetime, timedelta
import random
import os
import requests

app = Flask(__name__)

# --- Demo Data ---
client = {
    "name": "Robert Maglen",
    "avatar": "RM",
    "plan": "Tr. Plán",
    "plan_week": "Current w: 2:26",
}

retests = [
    {"date": "25.2.4", "tyzdne": "12 tyzdnov"},
    {"date": "23.3.4", "tyzdne": "12 tyzdnov"},
    {"date": "25.04.", "tyzdne": "12 tyzdnov"},
]

inbody_data = {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "values": [32.1, 30.5, 28.8, 27.2, 26.0, 25.1],
}

progress_data = {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
    "values": [38, 36, 34, 31, 29],
}

DAYS = ["MI", "UT", "ST", "ŠT", "PI", "SO", "NE"]
today = datetime(2025, 4, 27)

def get_week_days():
    start = today - timedelta(days=today.weekday())
    return [
        {"label": DAYS[i], "date": (start + timedelta(days=i)).day, "active": i == today.weekday()}
        for i in range(7)
    ]

SESSIONS = [
    {"id":1,"title":"Osobny  Training","start":"08:00","end":"10:00","day":0,"color":"blue"},
    {"id":2,"title":"Osobny Training","start":"09:00","end":"10:30","day":2,"color":"blue"},
    {"id":3,"title":"Osobny Training","start":"10:00","end":"11:30","day":1,"color":"blue"},
    {"id":4,"title":"Skupinovy Tréningy","start":"11:30","end":"12:30","day":1,"color":"teal"},
    {"id":5,"title":"vzpieranie Tréningy","start":"13:00","end":"14:00","day":1,"color":"orange"},
    {"id":6,"title":"Osobny Tréningy","start":"13:00","end":"14:00","day":2,"color":"teal"},
    {"id":7,"title":"Osobny Tréningy","start":"15:00","end":"16:00","day":2,"color":"blue"},
    {"id":8,"title":"Skupinovy Tréningy","start":"15:30","end":"17:00","day":1,"color":"teal"},
]

online_coaching = [
    {"label": "Vst. Dotazník", "icon": "📋"},
    {"label": "Nahrané Foto+Videá", "icon": "📷"},
    {"label": "Inbody", "icon": "📊"},
    {"label": "Výživa", "icon": "🥗"},
    {"label": "Onl. Coach", "icon": "💬"},
]

@app.route("/")
def index():
    return render_template("index.html",
        client=client,
        week_days=get_week_days(),
        sessions=SESSIONS,
        retests=retests,
        inbody_data=inbody_data,
        progress_data=progress_data,
        online_coaching=online_coaching,
        today_date=today.strftime("%d.%m.%Y"),
    )

@app.route("/api/progress")
def api_progress():
    return jsonify(progress_data)

@app.route("/api/inbody")
def api_inbody():
    return jsonify(inbody_data)

@app.route("/api/retest", methods=["POST"])
def api_retest():
    return jsonify({"status": "ok", "message": "Retest scheduled!"})

@app.route("/api/update_plan", methods=["POST"])
def api_update_plan():
    return jsonify({"status": "ok", "message": "Plan updated!"})

@app.route("/api/food-search")
def api_food_search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"products": []})
    try:
        resp = requests.get(
            "https://world.openfoodfacts.org/cgi/search.pl",
            params={
                "search_terms": query,
                "search_simple": 1,
                "action": "process",
                "json": 1,
                "page_size": 12,
                "fields": "product_name,nutriments,quantity,brands",
            },
            timeout=8,
        )
        resp.raise_for_status()
        raw = resp.json()
        products = []
        for p in raw.get("products", []):
            name = (p.get("product_name") or "").strip()
            if not name:
                continue
            n = p.get("nutriments") or {}
            products.append({
                "name": name,
                "brand": (p.get("brands") or "").split(",")[0].strip(),
                "calories": round(float(n.get("energy-kcal_100g") or 0), 1),
                "carbs":    round(float(n.get("carbohydrates_100g") or 0), 1),
                "proteins": round(float(n.get("proteins_100g") or 0), 1),
                "fats":     round(float(n.get("fat_100g") or 0), 1),
            })
        return jsonify({"products": products})
    except Exception:
        return jsonify({"products": [], "error": "Failed to fetch food data"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)
