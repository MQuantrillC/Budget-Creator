import { supabase } from './supabaseClient';

// Get the current authenticated user's ID
async function getCurrentUserId() {
  if (!supabase) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Auth error getting user:', error);
      return null;
    }
    return user?.id || null;
  } catch (err) {
    console.error('Exception getting user:', err);
    return null;
  }
}

// Save budget data for the current authenticated user
export async function saveUserBudgetData(budgetData) {
  if (!supabase) {
    return { error: 'No authentication available' };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: 'User not authenticated' };
  }

  try {
    const { data, error } = await supabase
      .from('user_budgets')
      .upsert({
        user_id: userId,
        budget_data: budgetData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Supabase save error:', error);
      return { error: error.message };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected save error:', err);
    return { error: err.message };
  }
}

// Load budget data for the current authenticated user
export async function loadUserBudgetData() {
  if (!supabase) {
    return { data: null, error: 'No authentication available' };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { data: null, error: 'User not authenticated' };
  }

  try {
    const { data, error } = await supabase
      .from('user_budgets')
      .select('budget_data')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - this is normal for new users
        return { data: null, error: null };
      }
      console.error('Supabase load error:', error);
      return { data: null, error: error.message };
    }

    return { data: data?.budget_data || null, error: null };
  } catch (err) {
    console.error('Unexpected load error:', err);
    return { data: null, error: err.message };
  }
}

export async function deleteUserBudgetData() {
  if (!supabase) {
    return { error: 'No authentication available' };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: 'User not authenticated' };
  }

  try {
    const { error } = await supabase
      .from('user_budgets')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase delete error:', error);
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    console.error('Unexpected delete error:', err);
    return { error: err.message };
  }
}
