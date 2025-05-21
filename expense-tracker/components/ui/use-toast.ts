type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast(props: ToastProps) {
  // This is a mock implementation
  console.log("Toast:", props)
}
