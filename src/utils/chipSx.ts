// src/utils/chipSx.ts
export const chipSx =
  (bg: string) =>
  (theme: any) => ({
    bgcolor: bg,
    color: theme.palette.getContrastText(bg),
    fontWeight: 800,
    borderRadius: 999,
  });
``