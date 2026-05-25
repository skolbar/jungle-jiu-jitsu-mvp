import "server-only"

export function isSetupRoutesEnabled() {
  return process.env.ENABLE_SETUP_ROUTES === "true"
}
