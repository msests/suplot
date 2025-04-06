import * as restify from "restify";
import { readFileSync } from "fs";
import { join, parse } from "path";

/**
 * @brief Server class for rendering and serving plot visualizations
 * @class RenderServer
 */
export class RenderServer {
  /** @brief The underlying Restify server instance */
  private server: restify.Server;

  /**
   * @brief Creates a new RenderServer instance with configured middleware
   */
  constructor() {
    this.server = restify.createServer();
    this.server.use(restify.plugins.bodyParser());
    this.server.use(restify.plugins.queryParser());

    this.handleStaticResource();
    this.handleCors();
  }

  /**
   * @brief Handles static resource requests like HTML, JS, CSS files
   * @private
   */
  private handleStaticResource() {
    this.server.get("*", async (req, res) => {
      // @ts-ignore
      const dir = parse(import.meta.url).dir.replace("file:///", "");

      const target = join(
        dir,
        "./public",
        req.params["*"] === "/" ? "index.html" : req.params["*"]
      );
      if (target.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
      } else if (target.endsWith(".js")) {
        res.setHeader("Content-Type", "text/javascript; charset=utf-8");
      } else if (target.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      } else if (target.endsWith(".png")) {
        res.setHeader("Content-Type", "image/png");
      } else if (target.endsWith(".ico")) {
        res.setHeader("Content-Type", "image/x-icon");
      }

      const content = readFileSync(target, "utf-8");
      res.sendRaw(content);

      res.status(200);
      res.end();
    });
  }

  /**
   * @brief Configures CORS headers for cross-origin requests
   * @private
   */
  private handleCors() {
    this.server.opts("*", async (req, res) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.status(200);
      res.end();
    });
  }

  /**
   * @brief Registers a callback for API requests at the specified path
   * @param path The API endpoint path
   * @param callback The function to handle the request
   */
  public handleApiRequest(
    path: string,
    callback: (req: restify.Request, res: restify.Response) => void
  ) {
    this.server.post(path, callback);
  }

  /**
   * @brief Starts the server on port 16000
   */
  public start() {
    this.server.listen(16000, "localhost", () => {
      console.log("Server started on port 16000...");
    });
  }
}
