import Image from 'next/image';

type GalleryImageCardProps = {
  src: string;
  alt: string;
};

export default function GalleryImageCard({ src, alt }: GalleryImageCardProps) {
  return (
    <article className='mx-auto w-full max-w-56'>
      <div className='relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-xl bg-fgs-surface'>
        <Image
          src={src}
          alt={alt}
          fill
          sizes='(max-width: 640px) 70vw, (max-width: 1280px) 30vw, 220px'
          className='object-contain'
        />
      </div>
    </article>
  );
}
