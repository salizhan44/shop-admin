export function BrandLogo(props: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo.png"
      alt="ROLA"
      className={props.className ?? "h-14 w-auto max-w-full"}
    />
  );
}
