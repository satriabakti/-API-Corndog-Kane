import express from 'express';
import env from '../../configs/env';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import router from './routers/index';
import bodyParser from 'body-parser';
export default class RestApiTransport{

  static app = express();
  static registerAppsUsed(): void {
    RestApiTransport.app.use(express.json());
    RestApiTransport.app.use(cors());
    RestApiTransport.app.use(helmet());
    RestApiTransport.app.use(morgan(env.app.debug ? 'dev' : 'combined'));
    // RestApiTransport.app.use(express.urlencoded({ extended: true }));
    RestApiTransport.app.use(bodyParser.urlencoded({ extended: true }));
    RestApiTransport.app.use('/api', router);
  }

  static boot() {
    const app = RestApiTransport.app; 
    RestApiTransport.registerAppsUsed();
    app.listen(env.transport.http.port, () => {
      console.log(`[RestApi Transport] Server started on port (${env.transport.http.port})`);
    });
    console.log('[RestApi Transport] Booted');
  }
}