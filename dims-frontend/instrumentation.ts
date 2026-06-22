export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { register: registerServer } = await import(
      "./instrumentation.node"
    );
    await registerServer();
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const { register: registerEdge } = await import("./instrumentation.edge");
    await registerEdge();
  }
}
