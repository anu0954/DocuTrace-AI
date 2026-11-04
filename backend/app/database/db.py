import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "docutrace.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            document_id TEXT PRIMARY KEY,
            original_filename TEXT NOT NULL,
            stored_filename TEXT NOT NULL,
            file_extension TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            file_hash TEXT NOT NULL,
            uploaded_at TEXT NOT NULL
        )
    """)

    connection.execute("""
        CREATE TABLE IF NOT EXISTS extracted_pages (
            page_id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id TEXT NOT NULL,
            page_number INTEGER NOT NULL,
            extracted_text TEXT,
            FOREIGN KEY (document_id)
                REFERENCES documents(document_id),
            UNIQUE(document_id, page_number)
        )
    """)

    connection.commit()
    connection.close()