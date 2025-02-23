import streamlit as st
import matplotlib.pyplot as plt
import numpy as np  # Import numpy

def calculate_social_security_breakeven(benefit_fra, annual_return, start_age_early, start_age_late, max_age=100):
    """Calculates the Social Security breakeven point, considering investment returns."""
    
    # Calculate actual benefits based on claiming age
    # Reduction for early retirement: 5/9% per month for first 36 months, 5/12% for additional months
    # Increase for delayed retirement: 8% per year (2/3% per month)
    def calculate_benefit_adjustment(claiming_age):
        fra_months = 67 * 12
        claiming_months = claiming_age * 12
        months_difference = claiming_months - fra_months
        
        if months_difference < 0:
            # Early retirement
            if months_difference >= -36:
                reduction = months_difference * (5/9/100)
            else:
                reduction = (-36 * (5/9/100)) + ((months_difference + 36) * (5/12/100))
            return benefit_fra * (1 + reduction)
        elif months_difference > 0:
            # Delayed retirement
            increase = months_difference * (2/3/100)
            return benefit_fra * (1 + increase)
        else:
            return benefit_fra

    benefit_early = calculate_benefit_adjustment(start_age_early)
    benefit_late = calculate_benefit_adjustment(start_age_late)

    monthly_return = (1 + annual_return) ** (1/12) - 1
    results = {f"age_{start_age_early}": [], f"age_{start_age_late}": []}
    cumulative_early = 0
    cumulative_late = 0

    for age in range(min(start_age_early, start_age_late), max_age + 1):
        # Early claim calculations
        if age >= start_age_early:
            for month in range(12):
                cumulative_early += benefit_early
                cumulative_early *= (1 + monthly_return)
            results[f"age_{start_age_early}"].append(cumulative_early)
        else:
            results[f"age_{start_age_early}"].append(0)  # Add 0 for years before claiming

        # Late claim calculations
        if age >= start_age_late:
            for month in range(12):
                cumulative_late += benefit_late
                cumulative_late *= (1 + monthly_return)
            results[f"age_{start_age_late}"].append(cumulative_late)
        else:
             results[f"age_{start_age_late}"].append(0)  #Add 0 for years before claiming.

    # Find breakeven age
    breakeven_age = None
    start_index_late = start_age_late - start_age_early  # Correct starting point
    for i in range(start_index_late, len(results[f"age_{start_age_early}"])):
      if results[f"age_{start_age_late}"][i] > results[f"age_{start_age_early}"][i]:
          breakeven_age = i + start_age_early
          break
    return results, breakeven_age

def plot_breakeven(results, start_age_early, start_age_late):
    """Plots the cumulative benefits."""

    ages = range(min(start_age_early, start_age_late), min(start_age_early, start_age_late) + len(results[f"age_{start_age_early}"]))  # Correct age range
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.plot(ages, results[f"age_{start_age_early}"], label=f"Claim at {start_age_early}")
    ax.plot(ages, results[f"age_{start_age_late}"], label=f"Claim at {start_age_late}")
    ax.set_xlabel("Age")
    ax.set_ylabel("Cumulative Benefits")
    ax.set_title("Social Security Breakeven Analysis with Investment Returns")
    ax.legend()
    ax.grid(True)
    return fig

def main():
    st.title("Social Security Breakeven Calculator")

    st.sidebar.header("Input Parameters")

    benefit_fra = st.sidebar.number_input("Monthly Benefit at Full Retirement Age (67)", min_value=100, value=2000, step=100)
    start_age_early = st.sidebar.number_input("Start Age (Earlier)", min_value=62, max_value=70, value=62, step=1)
    start_age_late = st.sidebar.number_input("Start Age (Later)", min_value=62, max_value=70, value=67, step=1)

    annual_return = st.sidebar.number_input("Annual Investment Return Rate (%)", min_value=0.0, max_value=20.0, value=6.0, step=0.1) / 100
    max_age = st.sidebar.number_input("Maximum Age", min_value=70, max_value=110, value=100, step=1)

    #Validation for starting ages.
    if start_age_early >= start_age_late:
        st.sidebar.error("The earlier starting age must be less than the later starting age.")
        return  # Stop execution if invalid input

    results, breakeven_age = calculate_social_security_breakeven(benefit_fra, annual_return, start_age_early, start_age_late, max_age)

    fig = plot_breakeven(results, start_age_early, start_age_late)
    st.pyplot(fig)


    if breakeven_age is not None:
        st.write(f"The breakeven age is approximately: {breakeven_age}")
    else:
        st.write("Breakeven not reached by the maximum age considered.")

    #Display Table
    st.subheader("Cumulative Benefits Table")
    data = []
    ages = range(min(start_age_early, start_age_late), min(start_age_early, start_age_late) + len(results[f"age_{start_age_early}"]))
    for i, age in enumerate(ages):
        row = {
            "Age": age,
            f"Cumulative Benefit (Age {start_age_early})": f"{results[f'age_{start_age_early}'][i]:.2f}",
            f"Cumulative Benefit (Age {start_age_late})": f"{results[f'age_{start_age_late}'][i]:.2f}"
        }
        data.append(row)
    st.dataframe(data)
if __name__ == "__main__":
    main()