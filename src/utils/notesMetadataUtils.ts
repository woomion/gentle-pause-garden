
export const extractStoreNameFromNotes = (notes: string | null): string => {
  if (!notes) return 'Unknown Store';
  
  if (notes.includes('STORE:')) {
    const storeMatch = notes.match(/STORE:([^|]*)/);
    if (storeMatch) {
      return storeMatch[1].trim();
    }
  }
  
  return 'Unknown Store';
};

export const extractProductLinkFromNotes = (notes: string | null): string | undefined => {
  if (!notes || !notes.includes('LINK:')) return undefined;
  
  const linkMatch = notes.match(/LINK:([^|]*)/);
  if (linkMatch) {
    return linkMatch[1].trim();
  }
  
  return undefined;
};

export const extractActualNotes = (notes: string | null): string | undefined => {
  if (!notes) return undefined;
  
  let actualNotes = notes;
  
  // Remove store name if it was stored there
  if (actualNotes.includes('STORE:')) {
    actualNotes = actualNotes.replace(/STORE:[^|]*\|?/, '').trim();
  }
  
  // Remove product link if it was stored there
  if (actualNotes.includes('LINK:')) {
    actualNotes = actualNotes.replace(/LINK:[^|]*\|?/, '').trim();
  }
  
  return actualNotes === '' ? undefined : actualNotes;
};

export const formatNotesWithMetadata = (
  storeName: string,
  productLink?: string,
  notes?: string
): string | null => {
  let notesWithMetadata = '';
  
  if (storeName && storeName !== 'Unknown Store') {
    notesWithMetadata = `STORE:${storeName}`;
  }
  
  if (productLink && productLink.trim()) {
    if (notesWithMetadata) {
      notesWithMetadata += `|LINK:${productLink}`;
    } else {
      notesWithMetadata = `LINK:${productLink}`;
    }
  }
  
  if (notes && notes.trim()) {
    if (notesWithMetadata) {
      notesWithMetadata += `|${notes}`;
    } else {
      notesWithMetadata = notes;
    }
  }
  
  return notesWithMetadata || null;
};
