"use client"

import { useEffect, useState } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({
  position = "top-right",
  duration = 4500,
  gap = 10,
  visibleToasts = 3,
  toastOptions,
  ...props
}: ToasterProps) => {
  const [mounted, setMounted] = useState(false)
  const { theme = "system" } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const defaultToastOptions = {
    descriptionClassName: "text-sm text-muted-foreground",
    className: "font-sans",
    closeButtonAriaLabel: "Close toast",
    classNames: {
      toast: "group toast rounded-lg border-border bg-popover text-foreground shadow-sm",
      title: "text-sm font-semibold",
      description: "text-sm text-muted-foreground",
      loader: "text-primary",
      closeButton:
        "opacity-70 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      success:
        "bg-green-500 text-white border-green-500",
      error:
        "bg-destructive/200 text-destructive border-destructive/20 dark:text-destructive",
      info: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300",
      warning:
        "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-300",
      loading: "text-primary",
    },
  } satisfies NonNullable<ToasterProps["toastOptions"]>

  const mergedToastOptions = {
    ...defaultToastOptions,
    ...(toastOptions ?? {}),
    classNames: {
      ...(defaultToastOptions.classNames ?? {}),
      ...(toastOptions?.classNames ?? {}),
    },
  } as ToasterProps["toastOptions"]

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={position}
      className="toaster group"
      duration={duration}
      gap={gap}
      visibleToasts={visibleToasts}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={mergedToastOptions}
      {...props}
    />
  )
}

export { Toaster }
