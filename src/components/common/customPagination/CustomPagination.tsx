import ReactPaginate from 'react-paginate';
import {
  PaginationNextArrowIcon,
  PaginationPrevArrowIcon,
} from '../../../assets/icons/SvgIcon';
import './CustomPagination.scss';

const CustomPagination = ({ handlePageChange, pageCount, forcePage }: any) => {
  return (
    <div className="custompagination">
      <ReactPaginate
        previousLabel={<PaginationPrevArrowIcon />}
        nextLabel={<PaginationNextArrowIcon />}
        breakLabel="..."
        pageCount={pageCount}
        onPageChange={handlePageChange}
        forcePage={forcePage}
        containerClassName="pagination"
        breakClassName="page-item"
        breakLinkClassName="page-link"
        pageClassName="page-item"
        pageLinkClassName="page-link"
        previousClassName="prevArrow"
        previousLinkClassName="page-link"
        nextClassName="nextArrow"
        nextLinkClassName="page-link"
        activeClassName="active"
      />
    </div>
  );
};

export default CustomPagination;
