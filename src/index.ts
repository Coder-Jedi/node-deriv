import configs from "./configs/index.js";
import globals from "./services/globals.js";
import * as api_server from "./api_server.js";


try{
    globals.init(configs).then(() => {
        api_server.start();
    });
}
catch (error){
    console.error(error);
    process.exit(1);
}