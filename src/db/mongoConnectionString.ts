export default function(dbConfig) {
    return "mongodb://" + dbConfig.host + ":" + dbConfig.port + "/" + dbConfig.database;
}