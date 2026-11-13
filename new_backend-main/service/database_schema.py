from sqlalchemy import inspect, text


def ensure_columns(engine, table_name, columns):
    inspector = inspect(engine)
    if not inspector.has_table(table_name):
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns(table_name)
    }
    missing_columns = {
        name: sql_type
        for name, sql_type in columns.items()
        if name not in existing_columns
    }
    if not missing_columns:
        return

    with engine.begin() as connection:
        for name, sql_type in missing_columns.items():
            connection.execute(text(
                f"ALTER TABLE {table_name} ADD COLUMN {name} {sql_type}"
            ))
