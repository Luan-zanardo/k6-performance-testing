import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getPokemonDuration = new Trend('get_pokemon', true);
export const RateContentOK = new Rate('content_OK');

export const options = {
  insecureSkipTLSVerify: true,
  thresholds: {
    http_req_failed: ['rate<0.25'],
    http_req_duration: ['p(90)<6800'],
    get_pokemon: ['p(90)<6800'],
    content_OK: ['rate>0.75']
  },
  stages: [
    { duration: '30s', target: 7 },
    { duration: '2m', target: 92 },
    { duration: '1m', target: 0 }
  ]
};

export function handleSummary(data) {
  return {
    './src/output/pokemon.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://pokeapi.co/api/v2/pokemon';

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;

  const res = http.get(`${baseUrl}`, params);

  getPokemonDuration.add(res.timings.duration);

  RateContentOK.add(res.status === OK);

  check(res, {
    'GET Pokemon - Status 200': () => res.status === OK
  });

  sleep(1);
}
