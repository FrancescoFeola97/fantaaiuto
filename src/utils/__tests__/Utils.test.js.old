import { describe, it, expect } from 'vitest';
import { Utils } from '../Utils.js';

describe('Utils', () => {
  describe('deepMerge', () => {
    it('should handle null/undefined source gracefully', () => {
      const target = { players: [] };
      
      expect(Utils.deepMerge(target, null)).toEqual(target);
      expect(Utils.deepMerge(target, undefined)).toEqual(target);
    });

    it('should merge objects correctly', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      
      const result = Utils.deepMerge(target, source);
      expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
    });
  });

  describe('validatePlayerName', () => {
    it('should validate correct player names', () => {
      expect(Utils.validatePlayerName('Cristiano Ronaldo')).toBe(true);
      expect(Utils.validatePlayerName("O'Neil")).toBe(true);
      expect(Utils.validatePlayerName('José María')).toBe(true);
    });

    it('should reject invalid names', () => {
      expect(Utils.validatePlayerName('')).toBe(false);
      expect(Utils.validatePlayerName(null)).toBe(false);
      expect(Utils.validatePlayerName('123')).toBe(false);
    });
  });

  describe('parseRole', () => {
    it('should parse role strings correctly', () => {
      expect(Utils.parseRole('A,Pc')).toEqual(['A', 'Pc']);
      expect(Utils.parseRole('Dc/B')).toEqual(['Dc', 'B']);
      expect(Utils.parseRole('M;C')).toEqual(['M', 'C']);
    });

    it('should filter invalid roles', () => {
      expect(Utils.parseRole('A,Invalid,Pc')).toEqual(['A', 'Pc']);
    });
  });

  describe('filterPlayers', () => {
    const players = [
      { nome: 'Ronaldo', ruoli: ['A'], status: 'owned', interessante: true },
      { nome: 'Messi', ruoli: ['T'], status: 'available', interessante: false },
      { nome: 'Buffon', ruoli: ['Por'], status: 'owned', interessante: false }
    ];

    it('should filter by search', () => {
      const result = Utils.filterPlayers(players, { search: 'ron' });
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Ronaldo');
    });

    it('should filter by role', () => {
      const result = Utils.filterPlayers(players, { role: 'Por' });
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Buffon');
    });

    it('should filter by status', () => {
      const result = Utils.filterPlayers(players, { status: 'owned' });
      expect(result).toHaveLength(2);
    });
  });
});