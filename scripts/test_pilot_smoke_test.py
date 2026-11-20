import json
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from scripts.pilot_smoke_test import normalize_base_url, run_smoke


class PilotHandler(BaseHTTPRequestHandler):
    health_ok = True

    def do_GET(self):
        if self.path == "/health":
            status = 200 if self.health_ok else 503
            payload = {"status": "ok" if self.health_ok else "unavailable"}
            body = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if self.path in {"/", "/search", "/login", "/register"}:
            body = b"<html><title>Roost</title><body>Roost</body></html>"
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        self.send_response(404)
        self.end_headers()

    def log_message(self, *_args):
        return


class PilotSmokeTest(unittest.TestCase):
    def setUp(self):
        PilotHandler.health_ok = True
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), PilotHandler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        host, port = self.server.server_address
        self.base_url = f"http://{host}:{port}"

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def test_normalize_base_url_requires_absolute_http_url(self):
        self.assertEqual(normalize_base_url(self.base_url + "/"), self.base_url)
        with self.assertRaises(ValueError):
            normalize_base_url("localhost:3000")
        with self.assertRaises(ValueError):
            normalize_base_url("file:///tmp/roost")

    def test_smoke_passes_health_and_public_routes(self):
        results = run_smoke(self.base_url, timeout=1)
        self.assertEqual(len(results), 5)
        self.assertTrue(all(result.ok for result in results))

    def test_smoke_fails_when_database_health_is_unavailable(self):
        PilotHandler.health_ok = False
        results = run_smoke(self.base_url, timeout=1)
        health = next(result for result in results if result.name == "health")
        self.assertFalse(health.ok)
        self.assertEqual(health.status, 503)
        self.assertTrue(all(result.ok for result in results if result.name != "health"))


if __name__ == "__main__":
    unittest.main()
