from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# Initialize app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///auth.db'

# Initialize database
db = SQLAlchemy(app)

# Set up CORS - very permissive (allow all)
CORS(app)


if __name__ == "__main__":
    app.run(debug=True)
