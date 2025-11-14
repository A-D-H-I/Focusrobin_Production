declare module 'react-responsive-masonry' {
  import { ReactNode } from 'react';

  interface MasonryProps {
    columnsCountBreakPoints?: {
      [key: number]: number;
    };
    columnsCount?: number;
    gutter?: string;
    children: ReactNode;
  }

  const Masonry: React.FC<MasonryProps>;
  export default Masonry;
}

