import {
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  handlePageChange: (page: number) => void;
}

export const paginationItems = ({
  currentPage,
  totalCount,
  itemsPerPage,
  handlePageChange,
}: PaginationProps) => {
  const pageRange = 1;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const items = [];

  if (totalPages > 0) {
    items.push(
      <PaginationItem key={1} className="cursor-pointer">
        <PaginationLink
          isActive={currentPage === 1}
          onClick={() => handlePageChange(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
  }

  if (currentPage > pageRange + 2) {
    items.push(<PaginationEllipsis key="first-ellipsis" />);
  }

  for (
    let page = Math.max(2, currentPage - pageRange);
    page <= Math.min(totalPages - 1, currentPage + pageRange);
    page++
  ) {
    items.push(
      <PaginationItem key={page} className="cursor-pointer">
        <PaginationLink
          isActive={currentPage === page}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </PaginationLink>
      </PaginationItem>
    );
  }

  if (currentPage < totalPages - pageRange - 1) {
    items.push(<PaginationEllipsis key="last-ellipsis" />);
  }

  if (totalPages > 1) {
    items.push(
      <PaginationItem key={totalPages} className="cursor-pointer">
        <PaginationLink
          isActive={currentPage === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </PaginationLink>
      </PaginationItem>
    );
  }

  return items;
};
