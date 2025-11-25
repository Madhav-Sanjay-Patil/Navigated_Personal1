# init.py — minimal DB/init setup (no schema changes)

from flask import Flask
from flask_cors import CORS
from flask_mysqldb import MySQL
# from routes_summary import summary_bp


print("this should run only once")

app: Flask = Flask(__name__)

CORS(app)

# MySQL connection config — use your existing DB
app.config["MYSQL_HOST"] = "localhost"
app.config["MYSQL_USER"] = "otageri"
app.config["MYSQL_PASSWORD"] = "784512963"
app.config["MYSQL_DB"] = "navigated_learning"


mysql: MySQL = MySQL(app)

# keep this if something else imports it
DBcreated: bool = False

# init.py (after db = SQLAlchemy(app))




# Optional: very simple health check (no DB touch)
@app.route("/health")
def health():
    return "ok", 200
