use sqlx::SqlitePool;
use anyhow::Result;

pub async fn init_db(database_url: &str) -> Result<SqlitePool> {
    let pool = sqlx::SqlitePool::connect(database_url).await?;
    run_migrations(&pool).await?;
    Ok(pool)
}

async fn run_migrations(pool: &SqlitePool) -> Result<()> {
    let migration_sql = include_str!("../../migrations/001_init.sql");
    sqlx::query(migration_sql).execute(pool).await?;
    Ok(())
}
