// Package version содержит метаданные сборки сервиса.
package version

import "runtime/debug"

// String возвращает человекочитаемую версию (git через debug.BuildInfo или dev).
func String() string {
	if bi, ok := debug.ReadBuildInfo(); ok && bi.Main.Version != "(devel)" {
		return bi.Main.Version
	}
	return "0.0.0-dev"
}
