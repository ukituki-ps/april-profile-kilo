package httpapi

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

const metricsNamespace = "april_profile"

var (
	metricsRegisterOnce sync.Once
	httpRequestsTotal   *prometheus.CounterVec
	httpRequestDuration *prometheus.HistogramVec
)

func registerHTTPMetrics() {
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Namespace: metricsNamespace,
			Subsystem: "http",
			Name:      "requests_total",
			Help:      "Total HTTP requests handled by AprilProfile.",
		},
		[]string{"method", "route", "status"},
	)
	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Namespace: metricsNamespace,
			Subsystem: "http",
			Name:      "request_duration_seconds",
			Help:      "HTTP request duration in seconds.",
			Buckets:   prometheus.DefBuckets,
		},
		[]string{"method", "route", "status"},
	)
}

// ensurePrometheusMetrics регистрирует HTTP-метрики один раз (Go/process уже в DefaultRegisterer у client_golang).
func ensurePrometheusMetrics() {
	metricsRegisterOnce.Do(func() {
		registerHTTPMetrics()
		prometheus.DefaultRegisterer.MustRegister(httpRequestsTotal, httpRequestDuration)
	})
}

func prometheusMetricsHandler() http.Handler {
	ensurePrometheusMetrics()
	return promhttp.Handler()
}

func withPrometheusHTTPMetrics(next http.Handler) http.Handler {
	ensurePrometheusMetrics()
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		route := r.Pattern
		if route == "" {
			route = "unknown"
		}
		lbl := prometheus.Labels{
			"method": r.Method,
			"route":  route,
			"status": strconv.Itoa(rec.status),
		}
		httpRequestsTotal.With(lbl).Inc()
		httpRequestDuration.With(lbl).Observe(time.Since(start).Seconds())
	})
}
