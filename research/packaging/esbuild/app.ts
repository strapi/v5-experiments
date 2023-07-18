import Koa from "koa";

// const app = new Koa();

// app.listen(3000, () => {
//   console.log("Server listening");
// });

const t0 = performance.now();

let sum = 0;
for (let i = 0; i < 1000000000; i++) {
  sum += 1;
}

const t1 = performance.now();
console.log(`Excution time: ${t1 - t0}ms`);
