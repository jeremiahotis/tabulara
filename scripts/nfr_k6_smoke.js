import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 5,
  duration: "5s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<300", "p(99)<700"],
  },
};

const TARGET = __ENV.TARGET_URL || "http://127.0.0.1:18080";

export default function () {
  const res = http.get(TARGET);
  check(res, {
    "status is 200": (r) => r.status === 200,
  });
  sleep(0.1);
}
