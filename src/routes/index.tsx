import { createFileRoute } from "@tanstack/react-router";
import { Component, type ReactNode } from "react";
import { GameCanvas } from "@/game/render/game-canvas";
import { Hud } from "@/game/ui/hud";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="fixed inset-0 h-dvh w-dvw touch-none overflow-hidden bg-bg text-fg select-none">
      <CanvasGuard>
        <GameCanvas />
      </CanvasGuard>
      <Hud />
    </main>
  );
}

class CanvasGuard extends Component<{ children: ReactNode }, { message: string | null }> {
  state = { message: null as string | null };

  static getDerivedStateFromError(error: unknown) {
    return {
      message: error instanceof Error ? error.message : "The core failed to render.",
    };
  }

  render() {
    if (this.state.message) {
      return (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="max-w-md text-fg">{this.state.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
