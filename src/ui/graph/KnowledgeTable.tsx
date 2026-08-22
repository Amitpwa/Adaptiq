'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import { MasteryDots } from '@/ui/graphics/MasteryDots';
import { tokens, masteryPalette } from '@/ui/tokens';
import { soundFx } from '@/ui/audio/sound';
import type { GraphNodeView } from '@/services/graph';

export function KnowledgeTable({
  nodes,
  onSelectNode,
}: {
  nodes: GraphNodeView[];
  onSelectNode: (node: GraphNodeView) => void;
}) {
  return (
    <TableContainer
      component={Paper}
      sx={{ borderRadius: tokens.radius.lg, border: 1, borderColor: 'divider', overflow: 'hidden' }}
    >
      <Table aria-label="Cognitive Knowledge state table">
        <TableHead sx={{ bgcolor: tokens.color.background }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Concept</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Mastery Density</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Retrievability</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Prerequisites</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {nodes.map((node) => {
            const palette = masteryPalette[node.band];
            return (
              <TableRow
                key={node.id}
                hover
                tabIndex={0}
                role="button"
                aria-label={`Inspect concept ${node.title}`}
                onClick={() => {
                  soundFx.playClick();
                  onSelectNode(node);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    soundFx.playClick();
                    onSelectNode(node);
                  }
                }}
                sx={{
                  cursor: 'pointer',
                  '&:last-child td, &:last-child th': { border: 0 },
                  '&:focus-visible': {
                    outline: `2px solid ${tokens.color.googleBlue}`,
                    outlineOffset: -2,
                  },
                }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {node.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {node.summary}
                  </Typography>
                </TableCell>
                <TableCell sx={{ width: 140 }}>
                  <Box sx={{ width: 100 }}>
                    <MasteryDots band={node.band} value={node.effectiveMastery} height={36} labelled={false} />
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={palette.label}
                    size="small"
                    sx={{
                      bgcolor: palette.fill,
                      color: palette.main,
                      fontWeight: 700,
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {Math.round(node.retrievability * 100)}%
                  </Typography>
                </TableCell>
                <TableCell>
                  {node.unmetPrerequisites.length === 0 ? (
                    <Typography variant="caption" sx={{ color: tokens.color.googleGreen, fontWeight: 700 }}>
                      ✓ Cleared
                    </Typography>
                  ) : (
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                      {node.unmetPrerequisites.map((p) => (
                        <Chip
                          key={p}
                          label={p}
                          size="small"
                          sx={{
                            bgcolor: tokens.color.gapFill,
                            color: tokens.color.googleRed,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            mb: 0.5,
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
