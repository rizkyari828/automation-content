"use client";

import { useEffect, useRef, useState } from "react";

export default function RevealOnScroll({
  as: Tag = "div",
  children,
  className = "",
  hiddenClassName = "",
  visibleClassName = "",
  delay = 0,
  threshold = 0.18,
  style,
  ...props
}) {
  const elementRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        setVisible(true);
        observer.unobserve(element);
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const classes = [className, hiddenClassName, visible ? visibleClassName : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      ref={elementRef}
      className={classes}
      style={{
        ...style,
        "--reveal-delay": `${delay}ms`
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}
