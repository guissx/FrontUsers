import 'next';

declare module 'next' {
  export type PageProps<T = {}> = {
    params: Promise<T>;
    searchParams?: { [key: string]: string | string[] | undefined };
  };
}