from flask import Flask, render_template, jsonify, request
from datetime import datetime, timedelta
import os
import requests
import sqlite3
import json
from pathlib import Path

app = Flask(__name__)
DATA_DIR = Path(__file__).parent
DB_PATH = DATA_DIR / 'maglen.db'


def get_db_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute('''CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        program_key TEXT, title TEXT, program_name TEXT,
        day_label TEXT, date TEXT, timestamp TEXT,
        exercise_count INTEGER, exercises TEXT)''')
    try:
        cur.execute('ALTER TABLE entries ADD COLUMN title TEXT')
    except sqlite3.OperationalError:
        pass
    cur.execute('''CREATE TABLE IF NOT EXISTS active_state (
        id INTEGER PRIMARY KEY, data TEXT, updated TEXT)''')
    cur.execute('''CREATE TABLE IF NOT EXISTS food_log (
        id INTEGER PRIMARY KEY, data TEXT, updated TEXT)''')
    cur.execute('''CREATE TABLE IF NOT EXISTS trainers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, email TEXT, phone TEXT,
        specialization TEXT, avatar TEXT,
        created_at TEXT DEFAULT (datetime('now')))''')
    cur.execute('''CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, email TEXT, phone TEXT,
        birthdate TEXT, goal TEXT, plan TEXT, avatar TEXT,
        trainer_id INTEGER, weight REAL, height REAL,
        body_fat REAL, notes TEXT, status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (trainer_id) REFERENCES trainers(id))''')

    cur.execute('SELECT COUNT(*) as cnt FROM trainers')
    if cur.fetchone()['cnt'] == 0:
        trainers = [
            ('Robert','Robert@maglen.sk','0900 111 222','Fyzio','R'),
            ('Michal','Michal@maglen.sk','0900 333 444','Silový tréning','M'),
            ('Petra','petra@maglen.sk','0900 555 666','Tabata & HIIT','P'),
        ]
        cur.executemany('INSERT INTO trainers (name,email,phone,specialization,avatar) VALUES (?,?,?,?,?)', trainers)

    cur.execute('SELECT COUNT(*) as cnt FROM clients')
    if cur.fetchone()['cnt'] == 0:
        clients = [
            ('Robert Maglen','robert@example.sk','0911 100 200','1985-03-15','Chudnutie','Tr. Plán A','RM',1,92.5,182.0,24.1,'VIP klient','active'),
            ('Petra Novotná','petra@example.sk','0911 200 300','1990-07-22','Naberanie svalov','Tr. Plán B','PN',2,62.0,168.0,18.5,'','active'),
            ('Lukáš Šimko','lukas@example.sk','0911 300 400','1992-11-05','Kondícia','Tr. Plán C','LŠ',1,78.0,176.0,16.2,'Bolesti chrbta','active'),
            ('Mária Kováčová','maria@example.sk','0911 400 500','1988-04-30','Rehabilitácia','Tr. Plán A','MK',3,58.5,162.0,22.3,'','active'),
            ('Jakub Mužík','jakub@example.sk','0911 500 600','1995-09-18','Výkon','Tr. Plán D','JH',2,85.0,185.0,12.8,'Závodný pretekár','active'),
            ('Zuzana Blaho','zuzana@example.sk','0911 600 700','1993-02-14','Chudnutie','Tr. Plán A','ZB',3,70.0,165.0,28.4,'','active'),
        ]
        cur.executemany('''INSERT INTO clients
            (name,email,phone,birthdate,goal,plan,avatar,trainer_id,weight,height,body_fat,notes,status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)''', clients)

    conn.commit()
    conn.close()


init_db()

client = {"name":"Robert Maglen","avatar":"RM","plan":"Tr. Plán","plan_week":"Current w: 2:26"}
retests = [{"date":"25.2.4","weeks":"12 týždňov"},{"date":"23.3.4","weeks":"12 týždňov"},{"date":"25.04.","weeks":"12 týždňov"}]
inbody_data = {"labels":["Jan","Feb","Mar","Apr","May","Jun"],"values":[32.1,30.5,28.8,27.2,26.0,25.1]}
progress_data = {"labels":["Jan","Feb","Mar","Apr","May"],"values":[38,36,34,31,29]}
DAYS = ["PO","UT","ST","ŠT","PI","SO","NE"]
today = datetime(2025,4,27)

def get_week_days():
    start = today - timedelta(days=today.weekday())
    return [{"label":DAYS[i],"date":(start+timedelta(days=i)).day,"active":i==today.weekday()} for i in range(7)]

SESSIONS = [
    {"id":1,"title":"Osobny Training","start":"08:00","end":"10:00","day":0,"color":"blue"},
    {"id":2,"title":"Osobny Training","start":"09:00","end":"10:30","day":2,"color":"blue"},
    {"id":3,"title":"Osobny Training","start":"10:00","end":"11:30","day":1,"color":"blue"},
    {"id":4,"title":"Skupinovy Tréningy","start":"11:30","end":"12:30","day":1,"color":"teal"},
    {"id":5,"title":"Vzpieranie","start":"13:00","end":"14:00","day":1,"color":"orange"},
    {"id":6,"title":"Osobny Tréningy","start":"13:00","end":"14:00","day":2,"color":"teal"},
    {"id":7,"title":"Osobny Tréningy","start":"15:00","end":"16:00","day":2,"color":"blue"},
    {"id":8,"title":"Skupinovy Tréningy","start":"15:30","end":"17:00","day":1,"color":"teal"},
]
online_coaching = [{"label":"Vst. Dotazník"},{"label":"Nahrané Foto+Videá"},{"label":"Inbody"},{"label":"Výživa"},{"label":"Onl. Coach"}]

@app.route("/")
def index():
    return render_template("index.html",
        client=client, week_days=get_week_days(), sessions=SESSIONS,
        retests=retests, inbody_data=inbody_data, progress_data=progress_data,
        online_coaching=online_coaching, today_date=today.strftime("%d.%m.%Y"))

@app.route("/api/progress")
def api_progress(): return jsonify(progress_data)

@app.route("/api/inbody")
def api_inbody(): return jsonify(inbody_data)

@app.route("/api/retest", methods=["POST"])
def api_retest(): return jsonify({"status":"ok","message":"Retest scheduled!"})

@app.route("/api/update_plan", methods=["POST"])
def api_update_plan(): return jsonify({"status":"ok","message":"Plan updated!"})

@app.route('/api/gym/overview')
def api_gym_overview():
    try:
        conn = get_db_conn(); cur = conn.cursor()
        cur.execute('SELECT COUNT(*) as cnt FROM clients WHERE status="active"')
        total_clients = cur.fetchone()['cnt']
        cur.execute('SELECT COUNT(*) as cnt FROM trainers')
        total_trainers = cur.fetchone()['cnt']
        cur.execute('SELECT AVG(body_fat) as avg FROM clients WHERE body_fat IS NOT NULL AND status="active"')
        avg_bf = round(cur.fetchone()['avg'] or 0,1)
        cur.execute('SELECT AVG(weight) as avg FROM clients WHERE weight IS NOT NULL AND status="active"')
        avg_weight = round(cur.fetchone()['avg'] or 0,1)
        cur.execute('''SELECT t.name, COUNT(c.id) as client_count FROM trainers t
            LEFT JOIN clients c ON c.trainer_id=t.id AND c.status="active"
            GROUP BY t.id ORDER BY client_count DESC''')
        trainer_load = [{'name':r['name'],'clients':r['client_count']} for r in cur.fetchall()]
        conn.close()
        return jsonify({'status':'ok','total_clients':total_clients,'total_trainers':total_trainers,
            'avg_body_fat':avg_bf,'avg_weight':avg_weight,'trainer_load':trainer_load,
            'total_sessions_week':len(SESSIONS),'monthly_revenue':total_clients*120})
    except Exception as e:
        return jsonify({'status':'error','message':str(e)}),500

@app.route('/api/clients', methods=['GET'])
def api_clients():
    try:
        conn = get_db_conn(); cur = conn.cursor()
        cur.execute('''SELECT c.*, t.name as trainer_name FROM clients c
            LEFT JOIN trainers t ON c.trainer_id=t.id ORDER BY c.created_at DESC''')
        rows = cur.fetchall(); conn.close()
        return jsonify({'status':'ok','clients':[dict(r) for r in rows]})
    except Exception as e:
        return jsonify({'status':'error','message':str(e)}),500

@app.route('/api/clients', methods=['POST'])
def api_add_client():
    try:
        data = request.get_json(force=True) or {}
        name = data.get('name','').strip()
        if not name: return jsonify({'status':'error','message':'Meno je povinné'}),400
        words = name.split()
        avatar = ''.join(w[0].upper() for w in words[:2]) if len(words)>=2 else name[:2].upper()
        conn = get_db_conn(); cur = conn.cursor()
        cur.execute('''INSERT INTO clients (name,email,phone,birthdate,goal,plan,avatar,trainer_id,weight,height,body_fat,notes,status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)''',
            (name,data.get('email',''),data.get('phone',''),data.get('birthdate',''),
             data.get('goal',''),data.get('plan',''),avatar,data.get('trainer_id') or None,
             data.get('weight') or None,data.get('height') or None,data.get('body_fat') or None,
             data.get('notes',''),'active'))
        conn.commit(); new_id=cur.lastrowid; conn.close()
        return jsonify({'status':'ok','id':new_id,'message':'Klient pridaný'})
    except Exception as e:
        return jsonify({'status':'error','message':str(e)}),500

@app.route('/api/clients/<int:client_id>', methods=['PUT'])
def api_update_client(client_id):
    try:
        data = request.get_json(force=True) or {}
        conn = get_db_conn(); cur = conn.cursor()
        cur.execute('''UPDATE clients SET name=?,email=?,phone=?,birthdate=?,goal=?,plan=?,
            trainer_id=?,weight=?,height=?,body_fat=?,notes=?,status=? WHERE id=?''',
            (data.get('name'),data.get('email'),data.get('phone'),data.get('birthdate'),
             data.get('goal'),data.get('plan'),data.get('trainer_id') or None,
             data.get('weight') or None,data.get('height') or None,data.get('body_fat') or None,
             data.get('notes'),data.get('status','active'),client_id))
        conn.commit(); conn.close()
        return jsonify({'status':'ok','message':'Klient aktualizovaný'})
    except Exception as e:
        return jsonify({'status':'error','message':str(e)}),500

@app.route('/api/clients/<int:client_id>', methods=['DELETE'])
def api_delete_client(client_id):
    try:
        conn = get_db_conn(); cur = conn.cursor()
        cur.execute('DELETE FROM clients WHERE id=?',(client_id,))
        conn.commit(); conn.close()
        return jsonify({'status':'ok','message':'Klient vymazaný'})
    except Exception as e:
        return jsonify({'status':'error','message':str(e)}),500

@app.route('/api/trainers', methods=['GET'])
def api_trainers():
    try:
        conn = get_db_conn(); cur = conn.cursor()
        cur.execute('''SELECT t.*, COUNT(c.id) as client_count FROM trainers t
            LEFT JOIN clients c ON c.trainer_id=t.id AND c.status="active"
            GROUP BY t.id ORDER BY t.name''')
        rows = cur.fetchall(); conn.close()
        return jsonify({'status':'ok','trainers':[dict(r) for r in rows]})
    except Exception as e:
        return jsonify({'status':'error','message':str(e)}),500

@app.route('/api/trainers', methods=['POST'])
def api_add_trainer():
    try:
        data = request.get_json(force=True) or {}
        name = data.get('name','').strip()
        if not name: return jsonify({'status':'error','message':'Meno je povinné'}),400
        words = name.split()
        avatar = ''.join(w[0].upper() for w in words[:2]) if len(words)>=2 else name[:2].upper()
        conn = get_db_conn(); cur = conn.cursor()
        cur.execute('INSERT INTO trainers (name,email,phone,specialization,avatar) VALUES (?,?,?,?,?)',
            (name,data.get('email',''),data.get('phone',''),data.get('specialization',''),avatar))
        conn.commit(); new_id=cur.lastrowid; conn.close()
        return jsonify({'status':'ok','id':new_id,'message':'Tréner pridaný'})
    except Exception as e:
        return jsonify({'status':'error','message':str(e)}),500

@app.route('/api/trainers/<int:trainer_id>', methods=['DELETE'])
def api_delete_trainer(trainer_id):
    try:
        conn = get_db_conn(); cur = conn.cursor()
        cur.execute('UPDATE clients SET trainer_id=NULL WHERE trainer_id=?',(trainer_id,))
        cur.execute('DELETE FROM trainers WHERE id=?',(trainer_id,))
        conn.commit(); conn.close()
        return jsonify({'status':'ok','message':'Tréner vymazaný'})
    except Exception as e:
        return jsonify({'status':'error','message':str(e)}),500

@app.route('/api/save_entry', methods=['POST'])
def api_save_entry():
    try:
        payload = request.get_json(force=True)
        if not payload: return jsonify({'status':'error','message':'No data provided'}),400
        conn = get_db_conn(); cur = conn.cursor()
        cur.execute('INSERT INTO entries (program_key,title,program_name,day_label,date,timestamp,exercise_count,exercises) VALUES (?,?,?,?,?,?,?,?)',
            (payload.get('programKey') or payload.get('program_key'),
             payload.get('title') or payload.get('name'),
             payload.get('programName') or payload.get('program_name'),
             payload.get('dayLabel') or payload.get('day_label'),
             payload.get('date'),payload.get('timestamp'),
             int(payload.get('exerciseCount') or 0),
             json.dumps(payload.get('exercises',[]))))
        conn.commit(); new_id=cur.lastrowid; conn.close()
        return jsonify({'status':'ok','message':'Entry saved','id':new_id})
    except Exception:
        return jsonify({'status':'error','message':'Failed to save entry'}),500

@app.route('/api/entries')
def api_entries():
    try:
        conn = get_db_conn(); cur = conn.cursor()
        cur.execute('SELECT * FROM entries ORDER BY id DESC')
        rows = cur.fetchall(); conn.close()
        out = [{'id':r['id'],'programKey':r['program_key'],'title':r['title'],
                'programName':r['program_name'],'dayLabel':r['day_label'],
                'date':r['date'],'timestamp':r['timestamp'],
                'exerciseCount':r['exercise_count'],
                'exercises':json.loads(r['exercises'] or '[]')} for r in rows]
        return jsonify({'status':'ok','entries':out})
    except Exception:
        return jsonify({'status':'error','message':'Failed to fetch entries'}),500

@app.route('/api/entries/<int:entry_id>', methods=['DELETE'])
def api_delete_entry(entry_id):
    try:
        conn = get_db_conn(); cur = conn.cursor()
        cur.execute('DELETE FROM entries WHERE id=?',(entry_id,))
        conn.commit(); deleted=cur.rowcount; conn.close()
        if deleted==0: return jsonify({'status':'error','message':'Entry not found'}),404
        return jsonify({'status':'ok','message':'Entry deleted'})
    except Exception:
        return jsonify({'status':'error','message':'Failed to delete entry'}),500

@app.route('/api/active_state', methods=['GET','POST','DELETE'])
def api_active_state():
    try:
        if request.method=='GET':
            conn=get_db_conn(); cur=conn.cursor()
            cur.execute('SELECT data,updated FROM active_state WHERE id=1')
            row=cur.fetchone(); conn.close()
            if not row: return jsonify({'status':'ok','state':None})
            return jsonify({'status':'ok','state':json.loads(row['data']),'updated':row['updated']})
        if request.method=='POST':
            payload=request.get_json(force=True) or {}
            data=json.dumps(payload.get('state') or payload)
            updated=payload.get('updated') or datetime.utcnow().isoformat()
            conn=get_db_conn(); cur=conn.cursor()
            cur.execute('REPLACE INTO active_state (id,data,updated) VALUES (1,?,?)',(data,updated))
            conn.commit(); conn.close()
            return jsonify({'status':'ok','message':'State saved'})
        if request.method=='DELETE':
            conn=get_db_conn(); cur=conn.cursor()
            cur.execute('DELETE FROM active_state WHERE id=1')
            conn.commit(); conn.close()
            return jsonify({'status':'ok','message':'State cleared'})
    except Exception:
        return jsonify({'status':'error','message':'Active state failed'}),500

@app.route('/api/food_log', methods=['GET','POST','DELETE'])
def api_food_log():
    try:
        if request.method=='GET':
            conn=get_db_conn(); cur=conn.cursor()
            cur.execute('SELECT data,updated FROM food_log WHERE id=1')
            row=cur.fetchone(); conn.close()
            if not row: return jsonify({'status':'ok','state':None})
            return jsonify({'status':'ok','state':json.loads(row['data']),'updated':row['updated']})
        if request.method=='POST':
            payload=request.get_json(force=True) or {}
            data=json.dumps(payload.get('state') or payload)
            updated=payload.get('updated') or datetime.utcnow().isoformat()
            conn=get_db_conn(); cur=conn.cursor()
            cur.execute('REPLACE INTO food_log (id,data,updated) VALUES (1,?,?)',(data,updated))
            conn.commit(); conn.close()
            return jsonify({'status':'ok','message':'Food log saved'})
        if request.method=='DELETE':
            conn=get_db_conn(); cur=conn.cursor()
            cur.execute('DELETE FROM food_log WHERE id=1')
            conn.commit(); conn.close()
            return jsonify({'status':'ok','message':'Food log cleared'})
    except Exception:
        return jsonify({'status':'error','message':'Food log failed'}),500

@app.route("/api/food-search")
def api_food_search():
    query = request.args.get("q","").strip()
    if not query: return jsonify({"products":[]})
    try:
        resp = requests.get("https://world.openfoodfacts.org/cgi/search.pl",
            params={"search_terms":query,"search_simple":1,"action":"process","json":1,
                    "page_size":12,"fields":"product_name,nutriments,brands,image_front_thumb_url"},
            headers={"User-Agent":"MaglenTrainingCenter/1.0"},timeout=15)
        resp.raise_for_status()
        raw = resp.json()
        products = []
        for p in raw.get("products",[]):
            name = (p.get("product_name") or "").strip()
            if not name: continue
            n = p.get("nutriments") or {}
            products.append({"name":name,"brand":(p.get("brands") or "").split(",")[0].strip(),
                "calories":round(float(n.get("energy-kcal_100g") or 0),1),
                "carbs":round(float(n.get("carbohydrates_100g") or 0),1),
                "proteins":round(float(n.get("proteins_100g") or 0),1),
                "fats":round(float(n.get("fat_100g") or 0),1),
                "image":p.get("image_front_thumb_url") or ""})
        return jsonify({"products":products})
    except requests.exceptions.Timeout:
        return jsonify({"products":[],"error":"Timeout"}),504
    except Exception as exc:
        return jsonify({"products":[],"error":"Failed"}),500

if __name__ == "__main__":
    port = int(os.environ.get("PORT","5000"))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0",port=port,debug=debug)
