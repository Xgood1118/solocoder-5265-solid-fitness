use csv::ReaderBuilder;
use std::env;
use std::path::Path;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().init();

    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://fitness.db?mode=rwc".to_string());

    let csv_path = env::args().nth(1).unwrap_or_else(|| "../seed/exercises.csv".to_string());

    println!("Initializing database...");
    let pool = sqlx::SqlitePool::connect(&database_url).await?;

    let migration_sql = include_str!("../../migrations/001_init.sql");
    sqlx::query(migration_sql).execute(&pool).await?;
    println!("Database initialized.");

    println!("Reading CSV from: {}", csv_path);
    let mut reader = ReaderBuilder::new()
        .has_headers(true)
        .from_path(Path::new(&csv_path))?;

    let mut count = 0;
    let mut skipped = 0;

    for result in reader.records() {
        let record = match result {
            Ok(r) => r,
            Err(e) => {
                eprintln!("Error reading record: {}", e);
                skipped += 1;
                continue;
            }
        };

        let name = record.get(0).unwrap_or("").trim().to_string();
        if name.is_empty() {
            skipped += 1;
            continue;
        }

        let primary_muscle = record.get(1).unwrap_or("").trim().to_string();
        let secondary_muscles = record.get(2).and_then(|s| if s.trim().is_empty() { None } else { Some(s.trim().to_string()) });
        let equipment = record.get(3).and_then(|s| if s.trim().is_empty() { None } else { Some(s.trim().to_string()) });
        let difficulty = record.get(4).unwrap_or("beginner").trim().to_string();
        let video_url = record.get(5).and_then(|s| if s.trim().is_empty() { None } else { Some(s.trim().to_string()) });
        let video_thumbnail: Option<String> = None;
        let steps = record.get(6).and_then(|s| if s.trim().is_empty() { None } else { Some(s.trim().to_string()) });
        let tips = record.get(7).and_then(|s| if s.trim().is_empty() { None } else { Some(s.trim().to_string()) });

        let existing: Option<(i64,)> = sqlx::query_as(
            "SELECT id FROM exercises WHERE name = ?"
        )
        .bind(&name)
        .fetch_optional(&pool)
        .await?;

        if existing.is_some() {
            skipped += 1;
            continue;
        }

        sqlx::query(
            r#"
            INSERT INTO exercises
                (name, primary_muscle, secondary_muscles, equipment, difficulty,
                 video_url, video_thumbnail, steps, tips)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&name)
        .bind(&primary_muscle)
        .bind(&secondary_muscles)
        .bind(&equipment)
        .bind(&difficulty)
        .bind(&video_url)
        .bind(video_thumbnail)
        .bind(&steps)
        .bind(&tips)
        .execute(&pool)
        .await?;

        count += 1;
        println!("  Imported: {}", name);
    }

    println!("\nImport complete!");
    println!("  Imported: {} exercises", count);
    println!("  Skipped: {} records", skipped);

    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM exercises")
        .fetch_one(&pool)
        .await?;
    println!("  Total exercises in DB: {}", total.0);

    Ok(())
}
