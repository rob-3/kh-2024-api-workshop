import { createServer, IncomingMessage } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";

/**
 * @type {{todos: {[key: string]: {id: string, name: string}}}}
 */
const db = JSON.parse(readFileSync("./db.json").toString());
console.log(db)

let sseConnections = [];

const saveDB = () => {
  writeFileSync("./db.json", JSON.stringify(db));
  for (const socket of sseConnections) {
    socket.write("data: " + JSON.stringify(db) + "\n\n")
  }
  console.log(db);
}

/**
 * @type {{[method: string]: {[path: string]: (req: IncomingMessage) => any}}}
 */
const routes = {
  "GET": {
    "/todo": (req) => {
      const id = req.url.split("/")[2];
      if (id) {
        const todo = db.todos[id];
        if (todo) {
          return {
            status: 200,
            headers: { "content-type": "application/json" },
            body: { "todo": todo }
          };
        } else {
          return {
            status: 404,
            headers: {},
            body: "404 Not Found",
          }
        }
      }
      return {
        status: 200,
        headers: { "content-type": "application/json" },
        body: { "todos": db.todos }
      };
    },
    "/subscribe": (_, res) => {
      sseConnections.push(res);
      return {
        status: 200,
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          "connection": "keep-alive",
        },
        body: null,
      }
    },
  },
  "POST": {
    "/todo": (req) => {
      const body = JSON.parse(req.body);
      if (body.id) {
        body.id = body.id.toLowerCase();
        const status = db.todos[body.id] ? 200 : 201;
        db.todos[body.id] = body;
        saveDB();
        return {
          status,
          headers: { "content-type": "application/json" },
          body: {
            id: body.id
          }
        };
      } else {
        return {
          status: 400,
          headers: {},
          body: 'Must provide an id in the body, like { "id": "2ed3ec4f-c126-444b-9239-96f240c113a5" }'
        };
      }
    }
  },
  "DELETE": {
    "/todo": (req) => {
      const id = req.url.split("/")[2];
      if (!db.todos[id]) {
        return {
          status: 404,
          headers: {},
          body: "404 Not Found",
        };
      }
      delete db.todos[id];
      saveDB();
      return {
        status: 204,
        headers: {},
        body: null
      }
    },
  },
  "OPTIONS": {
    "/todo": () => {
      return {
        status: 204,
        headers: { "access-control-allow-methods": "GET,HEAD,POST,DELETE,PATCH,PUT" },
        body: null,
      }
    }
  },
}

createServer((req, res) => {
  let bodyString = "";
  req.on('data', chunk => bodyString += chunk.toString());
  req.on('end', () => {
    const route = routes[req.method]?.[req.url.split("/").slice(0, 2).join("/")] ??
      (() => ({ status: 404, headers: {}, body: "404 Not Found" }));
    req.body = bodyString;
    const { status, headers, body, } =
      route(req, res) ?? { status: 500, headers: {}, body: "500 Internal Server Error" };
    for (const [header, value] of Object.entries(headers)) {
      res.setHeader(header, value);
    }
    res.setHeader("access-control-allow-origin", "*");
    res.writeHead(status);
    if (headers['content-type'] !== "text/event-stream") {
      res.end((body === null || body === undefined || typeof body === "string") ? body : JSON.stringify(body));
    }
  });
}).listen(3000);
