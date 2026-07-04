# go2rtc for Namstore

This Umbrel app runs go2rtc as a camera streaming proxy.

## Ports

- Umbrel app UI: proxied internally to container port 1984
- Direct Web UI / HTTP API: host port 1985
- RTSP output: host port 8555
- WebRTC: host port 8556

The direct Web UI/API uses host port 1985 so it does not clash with other go2rtc or Home Assistant installs. RTSP is exposed on 8555 so it does not clash with Neolink on 8554.

## Home Assistant URLs

```text
rtsp://YOUR_UMBREL_IP:8555/e321
http://YOUR_UMBREL_IP:1985/api/frame.jpeg?src=e321
http://YOUR_UMBREL_IP:1985/api/stream.mjpeg?src=e321
```
