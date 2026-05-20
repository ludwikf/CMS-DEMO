import { Button } from "@/components/ui/button";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class TableErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("OrdersTable Error: Component crashed");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Wystąpił błąd podczas ładowania tabeli
          </h3>
          <p className="text-gray-600 mb-4">
            Odśwież stronę lub skontaktuj się z administratorem.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Odśwież stronę
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
