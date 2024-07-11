use data::Warehouse;
use warp::Filter;
use once_cell::sync::OnceCell;

static WAREHOUSE: OnceCell<std::sync::Arc<tokio::sync::RwLock<Warehouse>>> = OnceCell::new();

mod elastic;
mod data;

async fn hello() -> Result<impl warp::Reply, warp::Rejection> {
    Ok("Hello, World!")
}

async fn elastic_health() -> Result<impl warp::Reply, warp::Rejection> {
    let warehouse = WAREHOUSE.get().unwrap().read().await;
    let health = warehouse.cluster.read().await;
    let health = serde_json::to_value(&*health).unwrap();
    Ok(warp::reply::json(&health))
}

async fn elastic_indices() -> Result<impl warp::Reply, warp::Rejection> {
    let warehouse = WAREHOUSE.get().unwrap().read().await;
    let indices = warehouse.indices.read().await;
    let indices = serde_json::to_value(&*indices).unwrap();
    Ok(warp::reply::json(&indices))
}

async fn elastic_recovery() -> Result<impl warp::Reply, warp::Rejection> {
    let warehouse = WAREHOUSE.get().unwrap().read().await;
    let recovery = warehouse.recovery.read().await;
    let recovery = serde_json::to_value(&*recovery).unwrap();
    Ok(warp::reply::json(&recovery))
}

#[tokio::main]
async fn main() {
    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"]);

    let health = warp::path!("elastic" / "health").and_then(elastic_health);
    let indices = warp::path!("elastic" / "indices").and_then(elastic_indices);
    let recovery = warp::path!("elastic" / "recovery").and_then(elastic_recovery);
    let hello = warp::path!("hello").and_then(hello);
    
    let routes = health
        .or(indices)
        .or(hello)
        .or(recovery)
        .with(cors);

    let warehouse = Warehouse::new("http://localhost:9200").await;
    let warehouse = std::sync::Arc::new(tokio::sync::RwLock::new(warehouse));
    Warehouse::start_refresh(warehouse.clone());
    WAREHOUSE.set(warehouse).unwrap();

    warp::serve(routes).run(([127, 0, 0, 1], 3030)).await;
}
