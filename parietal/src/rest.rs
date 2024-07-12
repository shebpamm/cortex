use crate::data::WAREHOUSE;
use log::debug;
use warp::Filter;
 
async fn hello() -> Result<impl warp::Reply, warp::Rejection> {
    Ok("Hello, World!")
}

async fn elastic_health() -> Result<impl warp::Reply, warp::Rejection> {
    let warehouse = WAREHOUSE.get().unwrap().read().await;
    let health = warehouse.cluster.read().await;
    debug!("{:?}", &*health);
    let health = serde_json::to_value(&*health).unwrap();
    Ok(warp::reply::json(&health))
}

async fn elastic_indices() -> Result<impl warp::Reply, warp::Rejection> {
    let warehouse = WAREHOUSE.get().unwrap().read().await;
    let indices = warehouse.indices.read().await;
    debug!("{:?}", &*indices);
    let indices = serde_json::to_value(&*indices).unwrap();
    Ok(warp::reply::json(&indices))
}

async fn elastic_recovery() -> Result<impl warp::Reply, warp::Rejection> {
    let warehouse = WAREHOUSE.get().unwrap().read().await;
    let recovery = warehouse.recovery.read().await;
    debug!("{:?}", &*recovery);
    let recovery = serde_json::to_value(&*recovery).unwrap();
    Ok(warp::reply::json(&recovery))
}

async fn elastic_relocating() -> Result<impl warp::Reply, warp::Rejection> {
    let warehouse = WAREHOUSE.get().unwrap().read().await;
    let shards = warehouse.shards.read().await;
    let unassigned = shards.iter().filter(|s| s.state != "STARTED").collect::<Vec<_>>();
    let shards = serde_json::to_value(&unassigned).unwrap();

    Ok(warp::reply::json(&shards))
}

pub fn build_routes() -> impl warp::Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    let hello = warp::path!("hello").and_then(hello);
    let elastic_health = warp::path!("elastic" / "health").and_then(elastic_health);
    let elastic_indices = warp::path!("elastic" / "indices").and_then(elastic_indices);
    let elastic_recovery = warp::path!("elastic" / "recovery").and_then(elastic_recovery);
    let elastic_relocating = warp::path!("elastic" / "relocating").and_then(elastic_relocating);

    hello
        .or(elastic_health)
        .or(elastic_indices)
        .or(elastic_recovery)
        .or(elastic_relocating)
}
