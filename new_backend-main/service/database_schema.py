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

    preparer = engine.dialect.identifier_preparer
    quoted_table = preparer.quote(table_name)
    with engine.begin() as connection:
        for name, sql_type in missing_columns.items():
            quoted_column = preparer.quote(name)
            connection.execute(text(
                f"ALTER TABLE {quoted_table} ADD COLUMN {quoted_column} {sql_type}"
            ))
