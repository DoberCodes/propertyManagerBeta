import React, { useEffect, useState } from 'react';
// Weather fetching disabled; external libs not required here.
import {
	Container,
	ZeroStateContainer,
	ViewButton,
	TipsContainer,
	TipsHeader,
	CardGrid,
	Card,
	OverlayBadge,
	PriorityPill,
	CardTitle,
	CardList,
	FooterRow,
	FooterLeft,
	FooterRight,
	SmallBadge,
	Controls,
	PageBadge,
	CardImageWrapper,
} from './SeasonalMaintenance.styles';

import seasonalTipCards, { SeasonalCard } from '../data/seasonalTipCards';

interface SeasonalMaintenanceProps {
	location?: { latitude: number; longitude: number } | null;
}

export const SeasonalMaintenance = ({ location }: SeasonalMaintenanceProps) => {
	const [cards, setCards] = useState<SeasonalCard[]>(seasonalTipCards);

	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [pageIndex, setPageIndex] = useState<number>(0);
	const [cardsPerPage, setCardsPerPage] = useState<number>(3);

	useEffect(() => {
		setCards(seasonalTipCards);
		setLoading(false);
		setError(null);
	}, [location]);

	// determine current season
	const getCurrentSeason = () => {
		const month = new Date().getMonth();
		if (month >= 2 && month <= 4) return 'spring';
		if (month >= 5 && month <= 7) return 'summer';
		if (month >= 8 && month <= 10) return 'fall';
		return 'winter';
	};

	const currentSeason = getCurrentSeason();

	// only show cards for the current season (fallback to all if none)
	const filteredCards = cards.filter((c) => c.season === currentSeason);
	const effectiveCards = filteredCards.length ? filteredCards : cards;

	const pages = Math.max(1, Math.ceil(effectiveCards.length / cardsPerPage));
	const visibleCards = effectiveCards.slice(
		pageIndex * cardsPerPage,
		pageIndex * cardsPerPage + cardsPerPage,
	);

	// keep pageIndex in range when pages change
	useEffect(() => {
		setPageIndex((p) => Math.min(p, Math.max(0, pages - 1)));
	}, [pages]);

	const prevPage = () => setPageIndex((p) => (p - 1 + pages) % pages);
	const nextPage = () => setPageIndex((p) => (p + 1) % pages);

	// responsive cards per page
	useEffect(() => {
		const update = () => {
			const w = window.innerWidth;
			setCardsPerPage(w < 900 ? 1 : 3);
		};
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);

	// No rotating text: cards provide full details; keep component static.

	return (
		<Container>
			{loading && (
				<ZeroStateContainer>
					<span>⏳</span>
					<p>Loading recommendations...</p>
				</ZeroStateContainer>
			)}
			{error && !cards.length && (
				<ZeroStateContainer>
					<span>⚠️</span>
					<p>Unable to load recommendations</p>
				</ZeroStateContainer>
			)}
			{!loading && cards.length > 0 && (
				<TipsContainer>
					<TipsHeader>Seasonal Maintenance Tips</TipsHeader>
					<CardGrid>
						{visibleCards.map((card, idx) => {
							const imageSrc =
								card.image && (card.image as string).startsWith('/')
									? (card.image as string)
									: card.image && (card.image as string).startsWith('http')
									? (card.image as string)
									: card.image
									? require(`../${card.image}`)
									: null;

							const priorityText =
								card.priorityLevel === 'high'
									? 'High Priority'
									: card.priorityLevel === 'medium'
									? 'Moderate Task'
									: 'Basic Task';

							const categoryText = card.riskCategory
								? `${card.riskCategory
										.charAt(0)
										.toUpperCase()}${card.riskCategory.slice(1)} Risk`
								: '';
							const serviceText =
								card.serviceLevel === 'professional'
									? 'Professional Service'
									: card.serviceLevel === 'moderate'
									? 'Moderate Task'
									: 'Basic Task';

							return (
								<Card key={card.id || `${pageIndex}-${idx}`}>
									<CardImageWrapper>
										<img
											src={
												imageSrc ||
												'https://via.placeholder.com/600x300?text=No+Image'
											}
											alt={card.title}
										/>
										<OverlayBadge $season={card.season}>
											<div
												style={{
													display: 'flex',
													gap: 10,
													alignItems: 'center',
												}}>
												<span style={{ fontSize: 13, fontWeight: 700 }}>
													{card.season &&
														card.season.charAt(0).toUpperCase() +
															card.season.slice(1)}
												</span>
												{categoryText && (
													<span
														style={{
															opacity: 0.9,
															fontSize: 13,
														}}>{` • ${categoryText}`}</span>
												)}
											</div>
											<PriorityPill
												level={
													card.priorityLevel === 'high'
														? 'High'
														: card.priorityLevel === 'medium'
														? 'Moderate'
														: 'Low'
												}
												$season={card.season}
											>
												{priorityText}
											</PriorityPill>
										</OverlayBadge>
									</CardImageWrapper>
									<div
										style={{
											padding: '18px 12px 12px 12px',
											flex: '1 1 auto',
										}}>
										<CardTitle>{card.title}</CardTitle>
										<CardList>
											{card.bullets.map((b, i) => (
												<li key={i}>{b}</li>
											))}
										</CardList>
									</div>
									<FooterRow>
										<SmallBadge>{serviceText}</SmallBadge>
									</FooterRow>
								</Card>
							);
						})}
					</CardGrid>
					<Controls>
						<ViewButton onClick={prevPage}>◀ Prev</ViewButton>
						<PageBadge>
							{pageIndex + 1} / {pages}
						</PageBadge>
						<ViewButton onClick={nextPage}>Next ▶</ViewButton>
					</Controls>
				</TipsContainer>
			)}
		</Container>
	);
};
