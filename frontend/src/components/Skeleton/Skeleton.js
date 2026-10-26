import React from 'react';
import './Skeleton.css';

/**
 * Basic Shimmer Box component
 */
export const SkeletonBox = ({ width = '100%', height = '16px', borderRadius = '4px', style = {} }) => (
  <span
    className="skeleton-shimmer skeleton-box"
    style={{ width, height, borderRadius, ...style }}
  />
);

/**
 * Skeleton for a single Product Card
 */
export const ProductCardSkeleton = () => (
  <div className="skeleton-card" aria-hidden="true">
    <div className="skeleton-card-media skeleton-shimmer" />
    <div className="skeleton-card-body">
      <div className="skeleton-meta-row">
        <SkeletonBox width="50px" height="12px" />
        <SkeletonBox width="60px" height="12px" />
      </div>
      <SkeletonBox width="85%" height="16px" />
      <SkeletonBox width="55%" height="16px" />
      <SkeletonBox width="90px" height="14px" borderRadius="3px" style={{ margin: '4px 0' }} />
      <div className="skeleton-price-row">
        <SkeletonBox width="70px" height="20px" borderRadius="4px" />
        <SkeletonBox width="45px" height="14px" borderRadius="4px" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton for list-view item
 */
export const ProductListItemSkeleton = () => (
  <div className="skeleton-list-item" aria-hidden="true">
    <div className="skeleton-list-media skeleton-shimmer" />
    <div className="skeleton-list-content">
      <SkeletonBox width="100px" height="12px" />
      <SkeletonBox width="70%" height="18px" />
      <SkeletonBox width="90px" height="14px" />
      <SkeletonBox width="80px" height="20px" />
    </div>
  </div>
);

/**
 * Grid of Skeleton Product Cards
 */
export const ProductGridSkeleton = ({ count = 8, viewMode = 'grid' }) => {
  const items = Array.from({ length: count });

  if (viewMode === 'list') {
    return (
      <div className="skeleton-list-wrapper" aria-busy="true" aria-label="Loading products">
        {items.map((_, i) => (
          <ProductListItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <>
      {items.map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </>
  );
};

/**
 * Skeleton for Product Detail Page
 */
export const ProductDetailSkeleton = () => (
  <div id="pd-wrapper" className="skeleton-detail-wrapper" aria-busy="true" aria-label="Loading product details">
    <div className="pd-inner-row skeleton-detail-row">
      {/* LEFT IMAGE SKELETON */}
      <div className="pd-image-side skeleton-detail-image">
        <div className="skeleton-detail-img-box skeleton-shimmer" />
      </div>

      {/* RIGHT CONTENT SKELETON */}
      <div className="pd-content-side skeleton-detail-content">
        <SkeletonBox width="180px" height="14px" />
        <SkeletonBox width="80%" height="32px" borderRadius="6px" />
        <SkeletonBox width="120px" height="18px" />

        <div style={{ display: 'flex', gap: '14px', margin: '15px 0' }}>
          <SkeletonBox width="90px" height="30px" borderRadius="6px" />
          <SkeletonBox width="70px" height="20px" borderRadius="4px" style={{ alignSelf: 'center' }} />
        </div>

        <SkeletonBox width="110px" height="16px" style={{ marginBottom: '4px' }} />

        {/* Action row skeleton */}
        <div style={{ display: 'flex', gap: '12px', margin: '10px 0 20px' }}>
          <SkeletonBox width="70px" height="44px" borderRadius="8px" />
          <SkeletonBox width="160px" height="44px" borderRadius="8px" />
          <SkeletonBox width="140px" height="44px" borderRadius="8px" />
        </div>

        {/* Description block skeleton */}
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SkeletonBox width="120px" height="20px" />
          <SkeletonBox width="100%" height="15px" />
          <SkeletonBox width="95%" height="15px" />
          <SkeletonBox width="90%" height="15px" />
          <SkeletonBox width="75%" height="15px" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Skeleton for Review Items
 */
export const ReviewSkeleton = ({ count = 3 }) => (
  <div aria-busy="true" aria-label="Loading reviews">
    {Array.from({ length: count }).map((_, i) => (
      <div className="skeleton-review-item" key={i}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SkeletonBox width="36px" height="36px" borderRadius="50%" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SkeletonBox width="110px" height="14px" />
            <SkeletonBox width="80px" height="12px" />
          </div>
        </div>
        <SkeletonBox width="100%" height="14px" />
        <SkeletonBox width="70%" height="14px" />
      </div>
    ))}
  </div>
);

/**
 * Skeleton for User Profile Page
 */
export const ProfileSkeleton = () => (
  <div className="account-page skeleton-profile-wrapper" aria-busy="true" aria-label="Loading profile">
    <div className="skeleton-profile-header">
      <div className="skeleton-avatar skeleton-shimmer" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
        <SkeletonBox width="200px" height="22px" />
        <SkeletonBox width="160px" height="14px" />
      </div>
    </div>

    <div className="skeleton-profile-body">
      <div className="skeleton-profile-sidebar">
        <SkeletonBox width="100%" height="45px" borderRadius="8px" />
        <SkeletonBox width="100%" height="45px" borderRadius="8px" />
        <SkeletonBox width="100%" height="45px" borderRadius="8px" />
        <SkeletonBox width="100%" height="45px" borderRadius="8px" />
      </div>

      <div className="skeleton-profile-main">
        <SkeletonBox width="150px" height="24px" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
          <SkeletonBox width="100%" height="70px" borderRadius="10px" />
          <SkeletonBox width="100%" height="70px" borderRadius="10px" />
          <SkeletonBox width="100%" height="70px" borderRadius="10px" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Skeleton for Admin Dashboard
 */
export const DashboardSkeleton = () => (
  <div aria-busy="true" aria-label="Loading dashboard">
    <div className="skeleton-dash-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="skeleton-stat-card" key={i}>
          <SkeletonBox width="46px" height="46px" borderRadius="10px" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
            <SkeletonBox width="80px" height="13px" />
            <SkeletonBox width="60px" height="22px" />
          </div>
        </div>
      ))}
    </div>

    <div className="admin-card" style={{ padding: '24px' }}>
      <SkeletonBox width="160px" height="20px" style={{ marginBottom: '20px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBox key={i} width="100%" height="38px" borderRadius="6px" />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Table Rows Skeleton for Admin Tables
 */
export const TableRowsSkeleton = ({ rows = 5, cols = 6 }) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r}>
        {Array.from({ length: cols }).map((_, c) => (
          <td key={c} className="skeleton-table-td">
            <span
              className="skeleton-shimmer skeleton-td-bar"
              style={{
                width: c === 0 ? '40px' : c === 1 ? '70%' : '50%',
                display: 'inline-block'
              }}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

