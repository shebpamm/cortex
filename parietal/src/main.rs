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

#[tokio::main]
async fn main() {
    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"]);

    let health = warp::path!("elastic" / "health").and_then(elastic_health);
    let indices = warp::path!("elastic" / "indices").and_then(elastic_indices);
    let hello = warp::path!("hello").and_then(hello);
    
    let routes = health.or(indices).or(hello).with(cors);

    let warehouse = Warehouse::new("http://localhost:9200").await;
    let warehouse = std::sync::Arc::new(tokio::sync::RwLock::new(warehouse));
    Warehouse::start_refresh(warehouse.clone());
    WAREHOUSE.set(warehouse).unwrap();

    warp::serve(routes).run(([127, 0, 0, 1], 3030)).await;
}
