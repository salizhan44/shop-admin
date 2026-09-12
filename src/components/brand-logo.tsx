export function BrandLogo(props: {
  className?: string;
  variant?: "default" | "menu";
}) {
  const src =
    props.variant === "menu"
      ? "/brand/logo_dark_admin.jpg"
      : "/brand/logo.png";
  const fallbackClass =
    props.variant === "menu"
      ? "h-16 w-auto max-w-[11rem] object-contain"
      : "h-14 w-auto max-w-full";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="ROLA" className={props.className ?? fallbackClass} />
  );
}
