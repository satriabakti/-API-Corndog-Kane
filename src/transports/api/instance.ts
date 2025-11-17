import express from 'express';
import { createServer } from 'http';
import env from '../../configs/env';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import router from './routers/index';
import bodyParser from 'body-parser';
import { initializeWebSocket } from '../websocket';
import { errorHandler } from './middlewares/errorHandler';

export default class RestApiTransport{

  static app = express();
  static httpServer = createServer(RestApiTransport.app);
  
  static registerAppsUsed(): void {
    RestApiTransport.app.use(express.json());
    RestApiTransport.app.use(cors({origin: '*'}));
    RestApiTransport.app.use(helmet());
    RestApiTransport.app.use(morgan(env.app.debug ? 'dev' : 'combined'));
    RestApiTransport.app.use(bodyParser.urlencoded({ extended: true }));
    RestApiTransport.app.use('/uploads', express.static('public'));
    RestApiTransport.app.use('/api', router);
    
    // Global error handler - must be last
    RestApiTransport.app.use(errorHandler);
  }

  static boot() {
    RestApiTransport.registerAppsUsed();
    
    // Initialize WebSocket
    initializeWebSocket(RestApiTransport.httpServer);
    
    RestApiTransport.httpServer.listen(env.transport.http.port, () => {
      console.log(`[RestApi Transport] Server started on port (${env.transport.http.port})`);
    });
    console.log('[RestApi Transport] Booted');
  }
}