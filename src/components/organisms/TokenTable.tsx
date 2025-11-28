'use client'

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { TokenColumn } from './TokenColumn';
import { FilterSidebar } from './FilterSidebar';
import {
    MOCK_TOKENS,
    MOCK_TOKENS_BNB,
    updateTokenData,
    generateNewSOLToken,
    generateNewBNBToken
} from '@/lib/mockData';
import { Token, MarketUpdate } from '@/types';
import { webSocketService } from '@/services/websocketMock';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { PulseHeader } from './PulseHeader';
import { ActionIcons } from '../molecules/ActionIcons';
import { useAppSelector } from '@/lib/store';

const TickerSettingsModal = dynamic(
    () => import('./TickerSettingsModal').then(mod => ({ default: mod.TickerSettingsModal })),
    { ssr: false }
);
const DisplaySettingsModal = dynamic(
    () => import('./DisplaySettingsModal').then(mod => ({ default: mod.DisplaySettingsModal })),
    { ssr: false }
);

/**
 * TokenTable
 *
 * Main container for displaying live token data across three columns
 * (New, Final Stretch, Migrated) with sorting, filtering, and chain switching.
 *
 * Behavior:
 * - Loads mock SOL/BNB tokens and switches data based on selected chain.
 * - Subscribes to websocket updates and batches incoming price changes.
 * - Adds periodic random updates and new tokens for visual activity.
 * - Applies keyword, protocol, quote token, liquidity, and volume filters.
 * - Applies per-column sorting based on global sort state.
 * - Renders TokenColumn components with virtualized rows.
 * - Controls filter sidebar, ticker settings modal, and display settings modal.
 *
 * @component
 *
 * @returns {JSX.Element}
 */


export const TokenTable: React.FC = () => {
    const [selectedChain, setSelectedChain] = useState<'SOL' | 'BNB'>('SOL');
    const [tokens, setTokens] = useState<Token[]>(MOCK_TOKENS);
    const [isLoading, setIsLoading] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [isTickerSettingsModalOpen, setIsTickerSettingsModalOpen] =
        useState(false);
    const [isDisplaySettingsModalOpen, setIsDisplaySettingsModalOpen] =
        useState(false);

    const {
        keywords,
        excludeKeywords,
        deselectedProtocols,
        deselectedQuoteTokens,
        minLiquidity,
        maxLiquidity,
        minVolume,
        maxVolume
    } = useAppSelector(state => state.filter);

    const sortState = useAppSelector(state => state.sort);

    /* ------------------------------------------
       Chain Switching
    ------------------------------------------ */
    useEffect(() => {
        setIsLoading(true);
        const newTokens = selectedChain === 'SOL' ? MOCK_TOKENS : MOCK_TOKENS_BNB;
        setTokens(newTokens);

        webSocketService.setTokens(newTokens);

        const timer = setTimeout(() => setIsLoading(false), 400);
        return () => clearTimeout(timer);
    }, [selectedChain]);

    /* ------------------------------------------
       Websocket Updates (batched via rAF)
    ------------------------------------------ */
    useEffect(() => {
        webSocketService.connect();

        // small buffer map to dedupe updates by tokenId
        const buffer: Record<string, MarketUpdate> = {};
        const unsubscribe = webSocketService.subscribe((updates: MarketUpdate[]) => {
            updates.forEach(u => { buffer[u.tokenId] = u; });
        });

        let raf = 0;
        const flush = () => {
            if (Object.keys(buffer).length) {
                setTokens(prev => {
                    const next = prev.map(t => {
                        const u = buffer[t.id];
                        if (!u) return t;
                        return {
                            ...t,
                            price: u.price,
                            priceChange24h: u.priceChange24h
                        };
                    });
                    // clear buffer
                    for (const k in buffer) delete buffer[k];
                    return next;
                });
            }
            raf = requestAnimationFrame(flush);
        };

        raf = requestAnimationFrame(flush);

        return () => {
            unsubscribe();
            webSocketService.disconnect();
            cancelAnimationFrame(raf);
        };
    }, [selectedChain]);

    /* ------------------------------------------
       Auto Random Update (keeps visual movement)
    ------------------------------------------ */
    useEffect(() => {
        const id = setInterval(() => {
            // small, cheap updates
            setTokens(prev => prev.map(t => updateTokenData(t)));
        }, 2000);
        return () => clearInterval(id);
    }, []);

    /* ------------------------------------------
       Random New Tokens
    ------------------------------------------ */
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const loop = () => {
            const wait = Math.random() * 15000;
            timeoutId = setTimeout(() => {
                const newToken =
                    selectedChain === 'SOL'
                        ? generateNewSOLToken()
                        : generateNewBNBToken();

                setTokens(prev => [newToken, ...prev]);
                loop();
            }, wait);
        };

        loop();

        return () => clearTimeout(timeoutId);
    }, [selectedChain]);

    /* ------------------------------------------
       Filtering
    ------------------------------------------ */
    const filteredTokens = useMemo(() => {
        // memoized filter to avoid recalculation on unrelated renders
        const search = keywords
            .toLowerCase()
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        const exclude = excludeKeywords
            .toLowerCase()
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        return tokens.filter(token => {
            const matchesSearch =
                search.length === 0 ||
                search.some(s => token.name.toLowerCase().includes(s) || token.symbol.toLowerCase().includes(s));

            const matchesExclude =
                exclude.length === 0 ||
                !exclude.some(s => token.name.toLowerCase().includes(s) || token.symbol.toLowerCase().includes(s));

            const matchesProtocol =
                deselectedProtocols.length === 0 || !deselectedProtocols.includes(token.protocol);

            const matchesQuote =
                deselectedQuoteTokens.length === 0 || !deselectedQuoteTokens.includes(token.quoteToken);

            const matchesLiqMin = minLiquidity === null || token.liquidity >= minLiquidity;
            const matchesLiqMax = maxLiquidity === null || token.liquidity <= maxLiquidity;

            const matchesVolMin = minVolume === null || token.volume24h >= minVolume;
            const matchesVolMax = maxVolume === null || token.volume24h <= maxVolume;

            return (
                matchesSearch &&
                matchesExclude &&
                matchesProtocol &&
                matchesQuote &&
                matchesLiqMin &&
                matchesLiqMax &&
                matchesVolMin &&
                matchesVolMax
            );
        });
    }, [tokens, keywords, excludeKeywords, deselectedProtocols, deselectedQuoteTokens, minLiquidity, maxLiquidity, minVolume, maxVolume]);

    /* ------------------------------------------
       Sorting Helpers
    ------------------------------------------ */
    const comparator = useMemo(() => ({
        marketCap: (a: Token, b: Token) => b.marketCap - a.marketCap,
        volume: (a: Token, b: Token) => b.volume24h - a.volume24h,
        liquidity: (a: Token, b: Token) => b.liquidity - a.liquidity,
        time: (a: Token, b: Token) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        price: (a: Token, b: Token) => b.price - a.price,
        holders: (a: Token, b: Token) => b.holders - a.holders
    }), []);

    const applySort = React.useCallback(
        (list: Token[], column: 'new' | 'final_stretch' | 'migrated') => {
            const { field, direction } = sortState[column];
            if (!field) return list;

            const comp = comparator[field];
            const sorted = [...list].sort(comp);
            return direction === 'asc' ? sorted.reverse() : sorted;
        },
        [sortState, comparator]
        );


    /* ------------------------------------------
       Columns (limit)
    ------------------------------------------ */
    const MAX = 12;

    const newPairs = useMemo(
        () =>
            applySort(
            filteredTokens.filter(t => t.status === "new"),
            "new"
            ).slice(0, MAX),
        [filteredTokens, sortState.new, applySort]
    );

    const finalStretch = useMemo(
        () =>
            applySort(
            filteredTokens.filter(t => t.status === "final_stretch"),
            "final_stretch"
            ).slice(0, MAX),
        [filteredTokens, sortState.final_stretch, applySort]
    );

    const migrated = useMemo(
        () =>
            applySort(
            filteredTokens.filter(t => t.status === "migrated"),
            "migrated"
            ).slice(0, MAX),
        [filteredTokens, sortState.migrated, applySort]
    );


    /* ------------------------------------------
       Render
    ------------------------------------------ */
    return (
        <div className="flex flex-col h-[100dvh] w-full bg-transparent fixed inset-0">

            {/* Header */}
            <div className="sticky top-0 z-50 bg-background">
                <AppHeader selectedChain={selectedChain} onChainSelect={setSelectedChain} />
                <ActionIcons
                    onSettingsClick={() => setIsTickerSettingsModalOpen(true)}
                    onStarClick={() => {}}
                    onChartClick={() => {}}
                />
                <PulseHeader
                    selectedChain={selectedChain}
                    onChainSelect={setSelectedChain}
                    onDisplayClick={() => setIsDisplaySettingsModalOpen(true)}
                />
            </div>

            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto relative">
                <div className="h-full min-h-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 border-t border-border/20">
                    <TokenColumn
                        title="New Pairs"
                        tokens={newPairs}
                        isLoading={isLoading}
                        showFilter={true}
                        onFilterClick={() => setIsFilterOpen(true)}
                        selectedChain={selectedChain}
                        columnType="new"
                    />

                    <TokenColumn
                        title="Final Stretch"
                        tokens={finalStretch}
                        isLoading={isLoading}
                        onFilterClick={() => setIsFilterOpen(true)}
                        selectedChain={selectedChain}
                        columnType="final_stretch"
                    />

                    <TokenColumn
                        title="Migrated"
                        tokens={migrated}
                        isLoading={isLoading}
                        onFilterClick={() => setIsFilterOpen(true)}
                        selectedChain={selectedChain}
                        columnType="migrated"
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-50 bg-background border-t border-border/20">
                <AppFooter selectedChain={selectedChain} />
            </div>

            {/* Modals */}
            <FilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
            <TickerSettingsModal
                isOpen={isTickerSettingsModalOpen}
                onClose={() => setIsTickerSettingsModalOpen(false)}
            />
            <DisplaySettingsModal
                isOpen={isDisplaySettingsModalOpen}
                onClose={() => setIsDisplaySettingsModalOpen(false)}
            />
        </div>
    );
};
