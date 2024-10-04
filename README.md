# API Workshop (Knight Hacks 2024)

This is a simple API written in Node.js with no dependencies. It is not hardened for security or production use cases; it's a quickstart for people new to API development. The CORS settings in particular are permissive to allow for simple interop in a hackathon environment.

## Getting Started

You need [Node.js](https://nodejs.org/en) or a Node-compatible runtime to execute this code.

```bash
git clone https://github.com/rob-3/kh-2024-api-workshop
cd kh-2024-api-workshop
node index.mjs
```

For development purposes, a poor man's hot reload via [`watchexec`](https://github.com/watchexec/watchexec) is the setup I use.

```bash
watchexec -e=mjs -c -r node index.mjs
```

## License

See [LICENSE.md](./LICENSE.md)

A credit to my repository is appreciated, but not required.
