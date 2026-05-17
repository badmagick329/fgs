import Image from 'next/image';

type GalleryImageCardProps = {
  src: string;
  alt: string;
  objectPosition?: string;
};

export default function GalleryImageCard({
  src,
  alt,
  objectPosition = 'center',
}: GalleryImageCardProps) {
  return (
    <article className='w-full'>
      <div className='relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-fgs-surface'>
        <Image
          src={src}
          alt={alt}
          fill
          sizes='(max-width: 640px) 84vw, (max-width: 1280px) 40vw, 360px'
          className='object-cover'
          style={{ objectPosition }}
        />
      </div>
    </article>
  );
}
