import Link from 'next/link';
import {ArrowLeft, ArrowRight} from 'react-feather';

export default function Navigation({back, next}) {
  return (
    <div className="flex text-xl lg:text-2xl mt-16 text-cyan-400">
      {back ? (
        <Link href={back.url}>
          <a
            href={back.url}
            className="break-all basis-auto lg:basis-0 flex-1 gap-2 items-center py-12 px-2 lg:px-4 lg:hover:bg-gray-800 rounded overflow-ellipsis overflow-hidden"
            aria-label="Back"
          >
            <div className="flex lg:hidden text-sm items-center text-right mb-2 text-gray-500">
              <ArrowLeft className="inline text-gray-500" />
              Back
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden lg:block">
                <ArrowLeft className="min-width-[24] text-red-300" />
              </span>
              <span className="text-gray-50">{back.title}</span>
            </div>
          </a>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
      {next ? (
        <Link href={next.url}>
          <a
            href={next.url}
            className="break-all basis-auto lg:basis-0 flex-1 gap-2 justify-end items-center py-12 px-2 lg:px-4 lg:hover:bg-gray-800 rounded overflow-ellipsis overflow-hidden"
            aria-label="Next"
          >
            <div className="flex justify-end lg:hidden text-sm items-center text-right mb-2 text-gray-500">
              Next
              <ArrowRight className="min-width-[24] inline text-gray-500" />
            </div>
            <div className="flex items-center gap-4 justify-end">
              <span className="text-gray-50">{next.title}</span>{' '}
              <span className="hidden lg:block">
                <ArrowRight className="min-width-[24] text-red-300" />
              </span>
            </div>
          </a>
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
