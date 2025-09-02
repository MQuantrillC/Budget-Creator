import { supabase } from './supabaseClient';

// User budget data operations
export async function saveUserBudgetData(userId, budgetData) {
  if (!supabase || !userId) return { error: 'No authentication available' };

  try {
    const { data, error } = await supabase
      .from('user_budgets')
      .upsert({
        user_id: userId,
        budget_data: budgetData,
        updated_at: new Date().toISOString()
      });

    return { data, error };
  } catch (err) {
    console.error('Error saving budget data:', err);
    return { error: err.message };
  }
}

export async function loadUserBudgetData(userId) {
  if (!supabase || !userId) return { data: null, error: 'No authentication available' };

  try {
    const { data, error } = await supabase
      .from('user_budgets')
      .select('budget_data')
      .eq('user_id', userId)
      .single();

    return { data: data?.budget_data || null, error };
  } catch (err) {
    console.error('Error loading budget data:', err);
    return { data: null, error: err.message };
  }
}

export async function deleteUserBudgetData(userId) {
  if (!supabase || !userId) return { error: 'No authentication available' };

  try {
    const { error } = await supabase
      .from('user_budgets')
      .delete()
      .eq('user_id', userId);

    return { error };
  } catch (err) {
    console.error('Error deleting budget data:', err);
    return { error: err.message };
  }
}
