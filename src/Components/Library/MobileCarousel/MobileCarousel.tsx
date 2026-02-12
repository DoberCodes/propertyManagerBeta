import React, { useState, useRef, ReactNode } from 'react';
import styled from 'styled-components';

export const CarouselContainer = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
	background: #f9fafb;
	border-radius: 12px;
`;

export const CarouselViewport = styled.div`
	width: 100%;
	overflow: hidden;
	border-radius: 8px;
`;

export const CarouselTrack = styled.div<{
	$currentIndex: number;
	$totalItems: number;
}>`
	display: flex;
	transition: transform 0.3s ease-out;
	transform: translateX(-${(props) => props.$currentIndex * 100}%);

	/* Allow smooth scrolling on mobile */
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	user-select: none;
`;

export const CarouselItem = styled.div`
	min-width: 100%;
	flex: 0 0 100%;
	margin-right: 16px;
`;

export const CarouselNavigation = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 16px;
	margin-top: 16px;
`;

export const NavButton = styled.button`
	background: rgba(0, 0, 0, 0.5);
	color: white;
	border: none;
	border-radius: 50%;
	width: 32px;
	height: 32px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	transition: background-color 0.2s ease;

	&:hover {
		background: rgba(0, 0, 0, 0.7);
	}

	&:disabled {
		background: rgba(0, 0, 0, 0.2);
		cursor: not-allowed;
	}
`;

export const IndicatorDots = styled.div`
	display: flex;
	gap: 4px;
`;

export const Dot = styled.button<{ $active: boolean }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	border: none;
	background: ${(props) =>
		props.$active ? '#3b82f6' : 'rgba(255, 255, 255, 0.5)'};
	cursor: pointer;
	transition: background-color 0.2s ease;
`;

export const NoItems = styled.div`
	text-align: center;
	padding: 40px 20px;
	color: #6b7280;
	font-size: 16px;
`;

interface MobileCarouselProps {
	items: ReactNode[];
	emptyMessage?: string;
	showNavigation?: boolean;
	showIndicators?: boolean;
}

export const MobileCarousel: React.FC<MobileCarouselProps> = ({
	items,
	emptyMessage = 'No items to display',
	showNavigation = true,
	showIndicators = true,
}) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState(0);
	const trackRef = useRef<HTMLDivElement>(null);

	if (items.length === 0) {
		return (
			<NoItems>
				<div>{emptyMessage}</div>
			</NoItems>
		);
	}

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsDragging(true);
		setDragStart(e.clientX);
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		setIsDragging(true);
		setDragStart(e.touches[0].clientX);
	};

	const handleMouseUp = (e: React.MouseEvent) => {
		handleDragEnd(e.clientX);
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		handleDragEnd(e.changedTouches[0].clientX);
	};

	const handleDragEnd = (endPos: number) => {
		if (!isDragging) return;
		setIsDragging(false);

		const diff = dragStart - endPos;
		const threshold = 50; // Minimum distance to trigger slide

		if (Math.abs(diff) > threshold) {
			if (diff > 0 && currentIndex < items.length - 1) {
				// Swiped left, go to next item
				setCurrentIndex(currentIndex + 1);
			} else if (diff < 0 && currentIndex > 0) {
				// Swiped right, go to previous item
				setCurrentIndex(currentIndex - 1);
			}
		}
	};

	const nextSlide = () => {
		setCurrentIndex((prev) => (prev + 1) % items.length);
	};

	const prevSlide = () => {
		setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
	};

	const goToSlide = (index: number) => {
		setCurrentIndex(index);
	};

	return (
		<CarouselContainer>
			<CarouselViewport>
				<CarouselTrack
					ref={trackRef}
					$currentIndex={currentIndex}
					$totalItems={items.length}
					onMouseDown={handleMouseDown}
					onMouseUp={handleMouseUp}
					onTouchStart={handleTouchStart}
					onTouchEnd={handleTouchEnd}>
					{items.map((item, index) => (
						<CarouselItem key={index}>{item}</CarouselItem>
					))}
				</CarouselTrack>
			</CarouselViewport>

			{(showNavigation || showIndicators) && items.length > 1 && (
				<CarouselNavigation>
					{showNavigation && (
						<>
							<NavButton onClick={prevSlide} disabled={currentIndex === 0}>
								‹
							</NavButton>
							<NavButton
								onClick={nextSlide}
								disabled={currentIndex === items.length - 1}>
								›
							</NavButton>
						</>
					)}
					{showIndicators && (
						<IndicatorDots>
							{items.map((_, index) => (
								<Dot
									key={index}
									$active={currentIndex === index}
									onClick={() => goToSlide(index)}
								/>
							))}
						</IndicatorDots>
					)}
				</CarouselNavigation>
			)}
		</CarouselContainer>
	);
};
